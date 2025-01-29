# outcome_selection.py
def select_highest_ranked_option(evaluated_options):
    # Function to select the highest-ranked option
    highest_ranked_option = max(evaluated_options, key=lambda x: x[1])
    return highest_ranked_option

def outcome_selection():
    options = [('option1', 2), ('option2', 3), ('option3', 1)]
    highest_ranked_option = select_highest_ranked_option(options)
    return highest_ranked_option

if __name__ == "__main__":
    highest_ranked_option = outcome_selection()
    print("Outcome Selection Complete")
    print("Highest-Ranked Option:", highest_ranked_option)
